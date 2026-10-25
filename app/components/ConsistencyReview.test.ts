import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createLocalReview,
  emptyReviewChecks,
  reviewChecks,
  type CandidateReview,
  type ReviewCheckId,
  type ReviewChecks,
  type ReviewDecision,
} from '../../shared/studio/contracts'
import ConsistencyReview from './ConsistencyReview.vue'

enableAutoUnmount(afterEach)

const completeChecks: ReviewChecks = { shape: true, color: true, details: true }
const identity = {
  referenceId: 'teapot-reference',
  candidateId: 'teapot-example',
  candidateSha256: 'a'.repeat(64),
}

function mountReview(
  props: { checks?: Readonly<ReviewChecks>; review?: CandidateReview | null } = {},
) {
  return mount(ConsistencyReview, {
    props: { checks: emptyReviewChecks(), review: null, ...props },
  })
}

function buttonByLabel(wrapper: ReturnType<typeof mountReview>, label: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === label)

  if (!button) throw new Error(`Button "${label}" was not found.`)

  return button
}

function checkboxByLabel(wrapper: ReturnType<typeof mountReview>, label: string) {
  const checkboxLabel = wrapper
    .findAll('label')
    .find((candidate) => candidate.text().includes(label))

  if (!checkboxLabel) throw new Error(`Checkbox "${label}" was not found.`)

  return checkboxLabel.get<HTMLInputElement>('input[type="checkbox"]')
}

describe('ConsistencyReview', () => {
  it('labels the review section and each manual check with its inspection guidance', () => {
    const wrapper = mountReview()
    const regionLabel = wrapper.get('section[aria-labelledby]').attributes('aria-labelledby')

    expect(wrapper.get(`#${regionLabel}`).text()).toBe('Would you use this as a product photo?')
    expect(wrapper.get('fieldset legend').text()).toBe('Product consistency checks')
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3)
    for (const check of reviewChecks) {
      expect(checkboxByLabel(wrapper, check.label).element.checked).toBe(false)
      expect(wrapper.text()).toContain(check.description)
    }
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
  })

  it('explains that decisions are local human attestations, not automatic scores or gates', () => {
    const wrapper = mountReview()

    expect(wrapper.text()).toContain('Check the actual image, not just the prompt.')
    expect(wrapper.text()).toContain('Accept only if all three are true.')
    expect(wrapper.text()).toContain('local to this page and clears on refresh')
    expect(wrapper.text()).toContain('not an automated score or a publication gate')
  })

  it('disables acceptance and emits no approval while checks are incomplete', async () => {
    const wrapper = mountReview()
    const accept = buttonByLabel(wrapper, 'Accept candidate')

    expect(accept.attributes()).toHaveProperty('disabled')
    await accept.trigger('click')

    expect(wrapper.emitted('decide')).toBeUndefined()
  })

  it.each(['shape', 'color', 'details'] as const)(
    'keeps acceptance disabled when only %s is unchecked',
    (unchecked) => {
      const wrapper = mountReview({ checks: { ...completeChecks, [unchecked]: false } })

      expect(buttonByLabel(wrapper, 'Accept candidate').attributes()).toHaveProperty('disabled')
    },
  )

  it('updates checkbox state and acceptance from new check props', async () => {
    const wrapper = mountReview()

    await wrapper.setProps({ checks: { shape: true, color: false, details: false } })
    expect(checkboxByLabel(wrapper, 'Shape and proportions').element.checked).toBe(true)
    expect(checkboxByLabel(wrapper, 'Product color').element.checked).toBe(false)
    expect(buttonByLabel(wrapper, 'Accept candidate').attributes()).toHaveProperty('disabled')

    await wrapper.setProps({ checks: completeChecks })

    expect(buttonByLabel(wrapper, 'Accept candidate').attributes()).not.toHaveProperty('disabled')
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
    expect(wrapper.emitted('decide')).toBeUndefined()

    await wrapper.setProps({ checks: emptyReviewChecks() })

    expect(buttonByLabel(wrapper, 'Accept candidate').attributes()).toHaveProperty('disabled')
    expect(checkboxByLabel(wrapper, 'Shape and proportions').element.checked).toBe(false)
  })

  it.each(reviewChecks)('emits the typed check ID and checked value for $id', async (check) => {
    const checks = Object.freeze(emptyReviewChecks())
    const onCheck = vi.fn<(id: ReviewCheckId, checked: boolean) => void>()
    const wrapper = mount(ConsistencyReview, { props: { checks, review: null, onCheck } })

    await checkboxByLabel(wrapper, check.label).setValue(true)

    expect(onCheck).toHaveBeenCalledWith(check.id, true)
    expect(wrapper.emitted<[ReviewCheckId, boolean]>('check')).toEqual([[check.id, true]])
    expect(checks).toEqual(emptyReviewChecks())
    expect(wrapper.emitted('decide')).toBeUndefined()

    await wrapper.setProps({ checks: { ...checks, [check.id]: true } })
    await checkboxByLabel(wrapper, check.label).setValue(false)

    expect(onCheck).toHaveBeenLastCalledWith(check.id, false)
    expect(wrapper.emitted<[ReviewCheckId, boolean]>('check')).toEqual([
      [check.id, true],
      [check.id, false],
    ])
  })

  it('emits approval when a person accepts after all checks, without self-approving', async () => {
    const onDecide = vi.fn<(decision: ReviewDecision) => void>()
    const wrapper = mount(ConsistencyReview, {
      props: { checks: completeChecks, review: null, onDecide },
    })

    await buttonByLabel(wrapper, 'Accept candidate').trigger('click')

    expect(onDecide).toHaveBeenCalledWith('approved')
    expect(wrapper.emitted<[ReviewDecision]>('decide')).toEqual([['approved']])
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
  })

  it('emits rejection while checks are empty without changing them or its status', async () => {
    const checks = Object.freeze(emptyReviewChecks())
    const wrapper = mountReview({ checks })
    const reject = buttonByLabel(wrapper, 'Needs changes')

    expect(reject.attributes()).not.toHaveProperty('disabled')
    await reject.trigger('click')

    expect(wrapper.emitted<[ReviewDecision]>('decide')).toEqual([['rejected']])
    expect(wrapper.emitted('check')).toBeUndefined()
    expect(checks).toEqual(emptyReviewChecks())
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
  })

  it('announces accepted, rejected, and cleared statuses from review props', async () => {
    const wrapper = mountReview()
    const approved = createLocalReview({ decision: 'approved', checks: completeChecks }, identity)
    const rejected = createLocalReview(
      { decision: 'rejected', checks: emptyReviewChecks() },
      identity,
    )

    await wrapper.setProps({ checks: completeChecks, review: approved })
    expect(wrapper.get('[role="status"]').text()).toBe('Accepted in this review')

    await wrapper.setProps({ checks: emptyReviewChecks(), review: rejected })
    expect(wrapper.get('[role="status"]').text()).toBe('Changes needed')

    await wrapper.setProps({ review: null })
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
  })

  it('emits a reset request without mutating its controlled review', async () => {
    const review = createLocalReview({ decision: 'approved', checks: completeChecks }, identity)
    const wrapper = mountReview({ checks: completeChecks, review })

    await buttonByLabel(wrapper, 'Reset').trigger('click')

    expect(wrapper.emitted<[]>('reset')).toEqual([[]])
    expect(wrapper.emitted('check')).toBeUndefined()
    expect(wrapper.emitted('decide')).toBeUndefined()
    expect(wrapper.get('[role="status"]').text()).toBe('Accepted in this review')
    expect(review.decision).toBe('approved')
  })

  it('emits a download request without claiming that an unreviewed candidate is approved', async () => {
    const wrapper = mountReview()

    await buttonByLabel(wrapper, 'Download evidence').trigger('click')

    expect(wrapper.emitted<[]>('download')).toEqual([[]])
    expect(wrapper.emitted('decide')).toBeUndefined()
    expect(wrapper.get('[role="status"]').text()).toBe('Not reviewed')
    expect(wrapper.findAll('a[download]')).toHaveLength(0)
  })
})
